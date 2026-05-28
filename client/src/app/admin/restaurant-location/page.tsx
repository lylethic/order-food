'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import restaurantLocationApiRequest from '@/apiRequests/restaurantLocation';
import { getCurrentLocation } from '@/lib/location';
import type { RestaurantLocationType } from '@/schemaValidations/restaurantLocation.schema';

type AlertType = 'success' | 'error' | null;

export default function RestaurantLocationPage() {
  const [location, setLocation]       = useState<RestaurantLocationType | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [detecting, setDetecting]     = useState(false);
  const [alert, setAlert]             = useState<{ type: AlertType; msg: string }>({ type: null, msg: '' });

  // Form state
  const [name, setName]               = useState('Main Branch');
  const [latitude, setLatitude]       = useState('');
  const [longitude, setLongitude]     = useState('');
  const [radiusMeters, setRadiusMeters] = useState('50');
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);

  // ── Load current location ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await restaurantLocationApiRequest.get();
        const data = (res.payload as { data?: RestaurantLocationType | null }).data;
        if (data) {
          setLocation(data);
          setName(data.name);
          setLatitude(String(data.latitude));
          setLongitude(String(data.longitude));
          setRadiusMeters(String(data.radius_meters));
          setGeofenceEnabled(data.geofence_enabled);
        }
      } catch {
        showAlert('error', 'Không thể tải vị trí nhà hàng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function showAlert(type: AlertType, msg: string) {
    setAlert({ type, msg });
    setTimeout(() => setAlert({ type: null, msg: '' }), 5000);
  }

  async function handleDetectLocation() {
    setDetecting(true);
    try {
      const coords = await getCurrentLocation();
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
      showAlert('success', `Đã xác định vị trí: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
    } catch (err: unknown) {
      showAlert('error', err instanceof Error ? err.message : 'Không thể xác định vị trí.');
    } finally {
      setDetecting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseInt(radiusMeters, 10);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      showAlert('error', 'Vĩ độ không hợp lệ (phải từ -90 đến 90).');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      showAlert('error', 'Kinh độ không hợp lệ (phải từ -180 đến 180).');
      return;
    }
    if (isNaN(radius) || radius < 10 || radius > 10_000) {
      showAlert('error', 'Bán kính phải từ 10 đến 10.000 mét.');
      return;
    }

    setSaving(true);
    try {
      const res = await restaurantLocationApiRequest.update({
        name: name.trim() || 'Main Branch',
        latitude: lat,
        longitude: lon,
        radius_meters: radius,
      });
      const updated = (res.payload as { data?: RestaurantLocationType | null }).data;
      if (updated) {
        setLocation(updated);
        setGeofenceEnabled(updated.geofence_enabled);
      }
      showAlert('success', 'Cập nhật vị trí nhà hàng thành công!');
    } catch {
      showAlert('error', 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleGeofence(checked: boolean) {
    try {
      const res = await restaurantLocationApiRequest.toggleGeofence(checked);
      const updated = (res.payload as { data?: RestaurantLocationType | null }).data;
      if (updated) {
        setLocation(updated);
        setGeofenceEnabled(updated.geofence_enabled);
      } else {
        setGeofenceEnabled(checked);
      }
      showAlert(
        'success',
        checked
          ? 'Đã bật kiểm tra vị trí GPS khi đặt món!'
          : 'Đã tắt kiểm tra vị trí GPS. Khách hàng ở mọi nơi đều có thể đặt món!'
      );
    } catch {
      showAlert('error', 'Không thể thay đổi trạng thái kiểm tra vị trí. Vui lòng thử lại.');
    }
  }

  // ── Google Maps preview URL ──────────────────────────────────────────────────
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const mapsUrl =
    !isNaN(lat) && !isNaN(lon)
      ? `https://www.google.com/maps?q=${lat},${lon}&z=17`
      : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl">
          <MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Vị trí nhà hàng</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình toạ độ GPS và bán kính cho phép đặt món
          </p>
        </div>
      </div>

      {/* Current saved location banner */}
      {location && (
        <div className="rounded-2xl border bg-card p-4 space-y-1 text-sm">
          <p className="font-semibold text-foreground">📍 Đang lưu trong cơ sở dữ liệu</p>
          <p className="text-muted-foreground">
            <span className="font-medium">Tên:</span> {location.name}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Toạ độ:</span>{' '}
            {location.latitude}, {location.longitude}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Bán kính:</span> {location.radius_meters} mét
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Kiểm tra vị trí:</span>{' '}
            {location.geofence_enabled ? 'Bật (Bắt buộc)' : 'Tắt (Cho phép đặt từ xa)'}
          </p>
        </div>
      )}

      {/* Geofence Toggle Card */}
      <div className="rounded-2xl border bg-card p-6 flex items-center justify-between shadow-sm">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span>🛡️ Kiểm tra vị trí GPS khi đặt món</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              geofenceEnabled 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            }`}>
              {geofenceEnabled ? 'Đang bật' : 'Đang tắt'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Khi bật, hệ thống sẽ giới hạn khách hàng chỉ được đặt món trong phạm vi bán kính cho phép. 
            Khi tắt, khách hàng ở bất kỳ đâu cũng có thể đặt món.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleToggleGeofence(!geofenceEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            geofenceEnabled ? 'bg-indigo-600' : 'bg-muted'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
              geofenceEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Alert */}
      {alert.type && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium border ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {alert.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {alert.msg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="rounded-2xl border bg-card p-6 space-y-5">

        {/* Branch name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold" htmlFor="location-name">
            Tên chi nhánh
          </label>
          <input
            id="location-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Main Branch"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="latitude">
              Vĩ độ (Latitude)
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="10.762622"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="longitude">
              Kinh độ (Longitude)
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="106.660172"
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Detect my location button */}
        <button
          type="button"
          id="detect-location-btn"
          onClick={handleDetectLocation}
          disabled={detecting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-300 text-indigo-700 dark:text-indigo-400 dark:border-indigo-700 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
        >
          <Navigation className={`w-4 h-4 ${detecting ? 'animate-pulse' : ''}`} />
          {detecting ? 'Đang xác định…' : 'Dùng vị trí hiện tại của tôi'}
        </button>

        {/* Radius */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold" htmlFor="radius">
            Bán kính cho phép đặt món (mét)
          </label>
          <input
            id="radius"
            type="number"
            min={10}
            max={10000}
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(e.target.value)}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-muted-foreground">
            Khách hàng phải ở trong bán kính này so với toạ độ nhà hàng để có thể đặt món.
          </p>
        </div>

        {/* Map preview link */}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:opacity-80"
          >
            <MapPin className="w-3.5 h-3.5" />
            Xem trên Google Maps
          </a>
        )}

        {/* Save button */}
        <button
          type="submit"
          id="save-location-btn"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {saving
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu…' : 'Lưu vị trí'}
        </button>
      </form>
    </div>
  );
}
