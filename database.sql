show tables;

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
    user_id int ,
    foreign key(user_id) references users(id) on delete cascade ,
    title varchar(255) not null,
    content text not null,
    created_at timestamp default current_timestamp
);


-- 2. Post-Category Relationship
CREATE TABLE post_categories (
    post_id INT,
    category_id INT,
    FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);
select * from post_categories;
-- 3. User-Category Preferences
CREATE TABLE user_categories (
    id INT,
    category_id INT,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (id, category_id)
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
-- 1. Categories Master Table
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);


-- select * from users ;

-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS post;
-- SET FOREIGN_KEY_CHECKS = 1;

-- SET FOREIGN_KEY_CHECKS = 0;

-- TRUNCATE TABLE comments;
-- TRUNCATE TABLE post_likes;
-- TRUNCATE TABLE post_categories;
-- TRUNCATE TABLE post;
-- TRUNCATE TABLE users;
-- TRUNCATE TABLE user_categories;

-- SET FOREIGN_KEY_CHECKS = 1;


-- ALTER TABLE post 
-- CHANGE COLUMN userid user_id INT NOT NULL;

-- ALTER TABLE post ADD COLUMN user_id INT NOT NULL;


-- desc post;



-- drop table post;

-- CREATE TABLE post_photos (
--     photo_id INT AUTO_INCREMENT PRIMARY KEY,
--     post_id INT NOT NULL,
--     photo_path VARCHAR(255) NOT NULL,
--     FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE CASCADE
-- );
-- insert into post(user_id,title,content) values (1,'Df','hj');
-- select * from post;
-- select * from post_photos;

-- drop table post_photos;


-- select * from categories;
-- INSERT INTO categories (name)
-- VALUES 
--   ('Technology'),
--   ('Culture'),
--   ('Politics'),
--   ('Self'),
--   ('Design'),
--   ('Entrepreneurship'),
--   ('Health'),
--   ('Productivity'),
--   ('Writing'),
--   ('Fashion'),
--   ('Music'),
--   ('TV'),
--   ('Movies');


-- select * from post_likes;
-- select * from comments;


