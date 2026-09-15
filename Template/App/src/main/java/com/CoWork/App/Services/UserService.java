package com.CoWork.App.Services;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.CoWork.App.Entities.User;
import com.CoWork.App.Repositories.UserRepository;

@Component
public class UserService {
    @Autowired
    private UserRepository userRepository;
    public void saveEntry(User user){
        try{
            userRepository.save(user);
        }
        catch(Exception e){
            System.out.println("Error:"+e);
        }
    }

    public List<User> getAll(){
        return userRepository.findAll();
    }

    public User findByUserName(String userName){
        return userRepository.findByUserName(userName);
    }

    public void deleteUserbyId(ObjectId id){
        userRepository.deleteById(id);
    }
}