package com.CoWork.App.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.CoWork.App.Entities.User;
import com.CoWork.App.Entities.User_short;
import com.CoWork.App.Services.UserService;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers(){
        return userService.getAll();
    }

    @PostMapping
    public void createUser(@RequestBody User user){
        userService.saveEntry(user);
    }

    @PutMapping("/{userName}")
    public ResponseEntity<?> updateUser(@RequestBody User user,@PathVariable String userName){
        User userInDb = userService.findByUserName(userName);
        if(userInDb != null){
            userInDb.setUserName(user.getUserName());
            userInDb.setPassword(user.getPassword());
            userService.saveEntry(userInDb);
            return new ResponseEntity<>(userInDb,HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping
    public ResponseEntity<?> deleteUser(@RequestBody User_short user){
        User userInDb=userService.findByUserName(user.getUserName());
        String password= user.getPassword();
        if(userInDb!=null){
            if(userInDb.getPassword().equals(password)){
                userService.deleteUserbyId(userInDb.getId());
                return new ResponseEntity<>("User Deleted",HttpStatus.OK);
            }
            else{
                return new ResponseEntity<>("UserName-Password combination incorrect",HttpStatus.BAD_REQUEST);
            }
        }
        return new ResponseEntity<>("User dose not exist",HttpStatus.NOT_FOUND);
    }
}
