from typing import Optional
import datetime
import decimal

from sqlalchemy import BigInteger, Boolean, CheckConstraint, Column, DateTime, Double, ForeignKeyConstraint, Identity, Index, Integer, Numeric, PrimaryKeyConstraint, String, Table, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ARRAY, OID, TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class PrismaMigrations(Base):
    __tablename__ = '_prisma_migrations'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='_prisma_migrations_pkey'),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    migration_name: Mapped[str] = mapped_column(String(255), nullable=False)
    started_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text('now()'))
    applied_steps_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    finished_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))
    logs: Mapped[Optional[str]] = mapped_column(Text)
    rolled_back_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(True))


class Categories(Base):
    __tablename__ = 'categories'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='categories_pkey'),
        Index('categories_name_key', 'name', unique=True)
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    img: Mapped[Optional[str]] = mapped_column(Text)

    menu_items: Mapped[list['MenuItems']] = relationship('MenuItems', back_populates='category')


t_pg_stat_statements = Table(
    'pg_stat_statements', Base.metadata,
    Column('userid', OID),
    Column('dbid', OID),
    Column('toplevel', Boolean),
    Column('queryid', BigInteger),
    Column('query', Text),
    Column('plans', BigInteger),
    Column('total_plan_time', Double(53)),
    Column('min_plan_time', Double(53)),
    Column('max_plan_time', Double(53)),
    Column('mean_plan_time', Double(53)),
    Column('stddev_plan_time', Double(53)),
    Column('calls', BigInteger),
    Column('total_exec_time', Double(53)),
    Column('min_exec_time', Double(53)),
    Column('max_exec_time', Double(53)),
    Column('mean_exec_time', Double(53)),
    Column('stddev_exec_time', Double(53)),
    Column('rows', BigInteger),
    Column('shared_blks_hit', BigInteger),
    Column('shared_blks_read', BigInteger),
    Column('shared_blks_dirtied', BigInteger),
    Column('shared_blks_written', BigInteger),
    Column('local_blks_hit', BigInteger),
    Column('local_blks_read', BigInteger),
    Column('local_blks_dirtied', BigInteger),
    Column('local_blks_written', BigInteger),
    Column('temp_blks_read', BigInteger),
    Column('temp_blks_written', BigInteger),
    Column('shared_blk_read_time', Double(53)),
    Column('shared_blk_write_time', Double(53)),
    Column('local_blk_read_time', Double(53)),
    Column('local_blk_write_time', Double(53)),
    Column('temp_blk_read_time', Double(53)),
    Column('temp_blk_write_time', Double(53)),
    Column('wal_records', BigInteger),
    Column('wal_fpi', BigInteger),
    Column('wal_bytes', Numeric),
    Column('jit_functions', BigInteger),
    Column('jit_generation_time', Double(53)),
    Column('jit_inlining_count', BigInteger),
    Column('jit_inlining_time', Double(53)),
    Column('jit_optimization_count', BigInteger),
    Column('jit_optimization_time', Double(53)),
    Column('jit_emission_count', BigInteger),
    Column('jit_emission_time', Double(53)),
    Column('jit_deform_count', BigInteger),
    Column('jit_deform_time', Double(53)),
    Column('stats_since', DateTime(True)),
    Column('minmax_stats_since', DateTime(True))
)


t_pg_stat_statements_info = Table(
    'pg_stat_statements_info', Base.metadata,
    Column('dealloc', BigInteger),
    Column('stats_reset', DateTime(True))
)


class RestaurantLocations(Base):
    __tablename__ = 'restaurant_locations'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='restaurant_locations_pkey'),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, server_default=text("'Main Branch'::character varying"))
    latitude: Mapped[float] = mapped_column(Double(53), nullable=False)
    longitude: Mapped[float] = mapped_column(Double(53), nullable=False)
    radius_meters: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('50'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    geofence_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)


class Roles(Base):
    __tablename__ = 'roles'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='roles_pkey'),
        Index('roles_name_key', 'name', unique=True)
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    description: Mapped[Optional[str]] = mapped_column(Text)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    user_roles: Mapped[list['UserRoles']] = relationship('UserRoles', back_populates='role')


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='users_pkey'),
        Index('idx_users_active', 'id', postgresql_where='((deleted = false) AND (active = true))'),
        Index('users_email_key', 'email', unique=True),
        Index('users_username_key', 'username', unique=True)
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    username: Mapped[Optional[str]] = mapped_column(Text)
    email: Mapped[Optional[str]] = mapped_column(Text)
    password: Mapped[Optional[str]] = mapped_column(Text)
    name: Mapped[Optional[str]] = mapped_column(Text)
    img: Mapped[Optional[str]] = mapped_column(Text)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    is_guest: Mapped[Optional[bool]] = mapped_column(Boolean)

    carts: Mapped[Optional['Carts']] = relationship('Carts', uselist=False, back_populates='user')
    notifications: Mapped[list['Notifications']] = relationship('Notifications', back_populates='user')
    orders: Mapped[list['Orders']] = relationship('Orders', back_populates='customer')
    refresh_tokens: Mapped[list['RefreshTokens']] = relationship('RefreshTokens', back_populates='user')
    user_roles: Mapped[list['UserRoles']] = relationship('UserRoles', back_populates='user')
    menu_item_comments: Mapped[list['MenuItemComments']] = relationship('MenuItemComments', back_populates='customer')
    menu_item_comment_replies: Mapped[list['MenuItemCommentReplies']] = relationship('MenuItemCommentReplies', back_populates='staff')


class Carts(Base):
    __tablename__ = 'carts'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user'),
        PrimaryKeyConstraint('id', name='carts_pkey'),
        UniqueConstraint('user_id', name='carts_user_id_key')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    created: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    user_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    session_id: Mapped[Optional[str]] = mapped_column(Text)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    user: Mapped[Optional['Users']] = relationship('Users', back_populates='carts')
    cart_items: Mapped[list['CartItems']] = relationship('CartItems', back_populates='cart')


class MenuItems(Base):
    __tablename__ = 'menu_items'
    __table_args__ = (
        ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL', onupdate='CASCADE', name='menu_items_category_id_fkey'),
        PrimaryKeyConstraint('id', name='menu_items_pkey'),
        Index('idx_menu_items_active', 'category_id', postgresql_where='(deleted = false)')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[decimal.Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    category_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    description: Mapped[Optional[str]] = mapped_column(Text)
    rating: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(2, 1))
    tag: Mapped[Optional[str]] = mapped_column(Text)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    category: Mapped[Optional['Categories']] = relationship('Categories', back_populates='menu_items')
    cart_items: Mapped[list['CartItems']] = relationship('CartItems', back_populates='menu_item')
    menu_item_comments: Mapped[list['MenuItemComments']] = relationship('MenuItemComments', back_populates='menu_item')
    menu_item_images: Mapped[list['MenuItemImages']] = relationship('MenuItemImages', back_populates='menu_item')
    order_items: Mapped[list['OrderItems']] = relationship('OrderItems', back_populates='menu_item')
    vat_configurations: Mapped[list['VatConfigurations']] = relationship('VatConfigurations', back_populates='menu_item')


class Notifications(Base):
    __tablename__ = 'notifications'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], name='notifications_user_id_fkey'),
        PrimaryKeyConstraint('id', name='notifications_pkey'),
        Index('idx_notifications_user_id', 'user_id')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=6), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    read_at: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=6))
    ref_id: Mapped[Optional[int]] = mapped_column(BigInteger)

    user: Mapped['Users'] = relationship('Users', back_populates='notifications')


class Orders(Base):
    __tablename__ = 'orders'
    __table_args__ = (
        CheckConstraint("payment_method::text = ANY (ARRAY['Cash'::character varying, 'Credit Card'::character varying, 'E-Wallet'::character varying, 'Bank Transfer'::character varying]::text[])", name='orders_payment_method_check'),
        ForeignKeyConstraint(['customer_id'], ['users.id'], ondelete='SET NULL', onupdate='CASCADE', name='orders_customer_id_fkey'),
        PrimaryKeyConstraint('id', name='orders_pkey'),
        Index('orders_ticket_number_key', 'ticket_number', unique=True)
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    ticket_number: Mapped[str] = mapped_column(Text, nullable=False)
    table_number: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'Received'::text"))
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    customer_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    wait_level: Mapped[Optional[str]] = mapped_column(Text)
    wait_time_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    is_paid: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    payment_method: Mapped[Optional[str]] = mapped_column(String(20))
    paid_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    total: Mapped[Optional[int]] = mapped_column(Integer)

    customer: Mapped[Optional['Users']] = relationship('Users', back_populates='orders')
    order_items: Mapped[list['OrderItems']] = relationship('OrderItems', back_populates='order')


class RefreshTokens(Base):
    __tablename__ = 'refresh_tokens'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', onupdate='CASCADE', name='refresh_tokens_user_id_fkey'),
        PrimaryKeyConstraint('id', name='refresh_tokens_pkey'),
        Index('refresh_tokens_expires_at_idx', 'expires_at'),
        Index('refresh_tokens_token_family_idx', 'token_family'),
        Index('refresh_tokens_token_key', 'token', unique=True),
        Index('refresh_tokens_user_id_idx', 'user_id')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    token: Mapped[str] = mapped_column(Text, nullable=False)
    token_family: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    device_info: Mapped[Optional[str]] = mapped_column(Text)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    revoked_at: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    revoked_reason: Mapped[Optional[str]] = mapped_column(String(50))

    user: Mapped['Users'] = relationship('Users', back_populates='refresh_tokens')


class UserRoles(Base):
    __tablename__ = 'user_roles'
    __table_args__ = (
        ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='RESTRICT', onupdate='CASCADE', name='user_roles_role_id_fkey'),
        ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='RESTRICT', onupdate='CASCADE', name='user_roles_user_id_fkey'),
        PrimaryKeyConstraint('user_id', 'role_id', name='user_roles_pkey')
    )

    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    role_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    role: Mapped['Roles'] = relationship('Roles', back_populates='user_roles')
    user: Mapped['Users'] = relationship('Users', back_populates='user_roles')


class CartItems(Base):
    __tablename__ = 'cart_items'
    __table_args__ = (
        ForeignKeyConstraint(['cart_id'], ['carts.id'], ondelete='CASCADE', name='fk_cart'),
        ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], name='fk_menu_item'),
        PrimaryKeyConstraint('id', name='cart_items_pkey')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    cart_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    menu_item_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    quantity: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('1'))
    modifications: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text()))
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    cart: Mapped['Carts'] = relationship('Carts', back_populates='cart_items')
    menu_item: Mapped['MenuItems'] = relationship('MenuItems', back_populates='cart_items')


class MenuItemComments(Base):
    __tablename__ = 'menu_item_comments'
    __table_args__ = (
        CheckConstraint('rating >= 1::numeric AND rating <= 5::numeric', name='menu_item_comments_rating_check'),
        CheckConstraint("status::text = ANY (ARRAY['Visible'::character varying, 'Hidden'::character varying, 'Pending'::character varying]::text[])", name='menu_item_comments_status_check'),
        ForeignKeyConstraint(['customer_id'], ['users.id'], name='menu_item_comments_customer_id_fkey'),
        ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='CASCADE', name='menu_item_comments_menu_item_id_fkey'),
        PrimaryKeyConstraint('id', name='menu_item_comments_pkey'),
        Index('idx_menu_item_comments_customer_id', 'customer_id'),
        Index('idx_menu_item_comments_menu_item_id', 'menu_item_id')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    menu_item_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'Visible'::character varying"))
    created: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    rating: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(2, 1))
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    customer: Mapped['Users'] = relationship('Users', back_populates='menu_item_comments')
    menu_item: Mapped['MenuItems'] = relationship('MenuItems', back_populates='menu_item_comments')
    menu_item_comment_replies: Mapped[list['MenuItemCommentReplies']] = relationship('MenuItemCommentReplies', back_populates='comment')


class MenuItemImages(Base):
    __tablename__ = 'menu_item_images'
    __table_args__ = (
        ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='CASCADE', name='fk_menu_item'),
        PrimaryKeyConstraint('id', name='menu_item_images_pkey')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    menu_item_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    is_primary: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text('false'))
    display_order: Mapped[Optional[int]] = mapped_column(Integer, server_default=text('0'))

    menu_item: Mapped['MenuItems'] = relationship('MenuItems', back_populates='menu_item_images')


class OrderItems(Base):
    __tablename__ = 'order_items'
    __table_args__ = (
        ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='RESTRICT', onupdate='CASCADE', name='order_items_menu_item_id_fkey'),
        ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE', onupdate='CASCADE', name='order_items_order_id_fkey'),
        PrimaryKeyConstraint('id', name='order_items_pkey')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    menu_item_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    name_at_order: Mapped[str] = mapped_column(Text, nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_order: Mapped[decimal.Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    modifications: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text()))
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    menu_item: Mapped['MenuItems'] = relationship('MenuItems', back_populates='order_items')
    order: Mapped['Orders'] = relationship('Orders', back_populates='order_items')


class VatConfigurations(Base):
    __tablename__ = 'vat_configurations'
    __table_args__ = (
        CheckConstraint('is_global = true AND menu_item_id IS NULL OR is_global = false AND menu_item_id IS NOT NULL', name='vat_config_target_check'),
        ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='CASCADE', onupdate='CASCADE', name='vat_configurations_menu_item_id_fkey'),
        PrimaryKeyConstraint('id', name='vat_configurations_pkey'),
        Index('idx_vat_configs_global', 'is_global', postgresql_where='((deleted = false) AND (active = true))'),
        Index('idx_vat_configs_menu_item', 'menu_item_id', postgresql_where='((deleted = false) AND (active = true))')
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    rate: Mapped[decimal.Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    is_global: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created: Mapped[datetime.datetime] = mapped_column(TIMESTAMP(precision=3), nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    menu_item_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP(precision=3))
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    menu_item: Mapped[Optional['MenuItems']] = relationship('MenuItems', back_populates='vat_configurations')


class MenuItemCommentReplies(Base):
    __tablename__ = 'menu_item_comment_replies'
    __table_args__ = (
        ForeignKeyConstraint(['comment_id'], ['menu_item_comments.id'], ondelete='CASCADE', name='menu_item_comment_replies_comment_id_fkey'),
        ForeignKeyConstraint(['staff_id'], ['users.id'], name='menu_item_comment_replies_staff_id_fkey'),
        PrimaryKeyConstraint('id', name='menu_item_comment_replies_pkey'),
        Index('idx_menu_item_comment_replies_comment_id', 'comment_id'),
        Index('idx_menu_item_comment_replies_staff_id', 'staff_id')
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=9223372036854775807, cycle=False, cache=1), primary_key=True, autoincrement=True)
    comment_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    staff_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, server_default=text('now()'))
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    updated: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    created_by: Mapped[Optional[int]] = mapped_column(BigInteger)
    updated_by: Mapped[Optional[int]] = mapped_column(BigInteger)

    comment: Mapped['MenuItemComments'] = relationship('MenuItemComments', back_populates='menu_item_comment_replies')
    staff: Mapped['Users'] = relationship('Users', back_populates='menu_item_comment_replies')
