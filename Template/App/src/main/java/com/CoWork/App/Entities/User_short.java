package com.CoWork.App.Entities;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import lombok.Data;

@Data
public class User_short {
    @Id
    private ObjectId id;
    @Indexed(unique = true)
    private String userName;
    private String password;
    private int type;

}
