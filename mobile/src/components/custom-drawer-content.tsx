import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1 }}>
      {/* Top Section: Logo and App Name */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Image 
          source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }} // Replace with actual logo
          style={styles.logo} 
        />
        <Text style={styles.appName}>{t('appName')}</Text>
      </View>

      {/* Middle Section: Menu Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Bottom Section: Avatar, Name, and Logout Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }} // Replace with actual avatar
            style={styles.avatar} 
          />
          <Text style={styles.userName}>User Name</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => console.log('Logout pressed')}
        >
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 15,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});
