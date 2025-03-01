CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table post (
	post_id int auto_increment primary key,
    id int ,
    foreign key(id) references users(id) on delete cascade ,
    title varchar(255) not null,
    content text not null,
    created_at timestamp default current_timestamp
);

create table post_likes (
	id int not null,
	post_id int not null,
    primary key(id,post_id),
    foreign key(id) references users(id) on delete cascade,
    foreign key(post_id) references post(post_id) on delete cascade
);

create table comments (
	comment_id int auto_increment primary key,
	id int not null,
    post_id int not null,
    content text not null,
    created_at timestamp default current_timestamp ,
    foreign key(id) references users(id) on delete cascade,
    foreign key(post_id) references post(post_id) on delete cascade
);