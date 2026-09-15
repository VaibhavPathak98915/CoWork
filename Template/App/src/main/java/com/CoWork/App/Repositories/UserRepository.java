package com.CoWork.App.Repositories;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.CoWork.App.Entities.User;

public interface UserRepository extends MongoRepository<User,ObjectId> {

    User findByUserName(String username);

}
