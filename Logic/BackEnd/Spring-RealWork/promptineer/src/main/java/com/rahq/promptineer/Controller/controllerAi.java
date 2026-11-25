package com.rahq.promptineer.Controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController 
public class controllerAi {

    

    private final ChatClient chatClient;


    public controllerAi(ChatClient.Builder builder) {
    this.chatClient = builder.build();
}

    @GetMapping("/ai")
    public String generation(String userInput) {
        return this.chatClient.prompt()
            .user(userInput)
            .call()     // this sends the call to the llm 
            .content();// this waits for llm to respond as a string
    }

    @GetMapping("/test")
    public String generate(@RequestParam (value = "message", defaultValue = "tell a dad joke about me") String msg) {

        return chatClient.prompt()
                    .user(msg)
                    .call()
                    .content();
        
    }
    
    
    
}
