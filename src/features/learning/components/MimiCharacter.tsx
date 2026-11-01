import React, { useEffect, useRef } from "react";

import {
  Animated,
  Image,
  StyleSheet,
  View,
} from "../../../web/dom";


type Props = {
  emotion?: 
    | "happy"
    | "talking"
    | "celebrate"
    | "wave";

  size?: number;
};



export default function MimiCharacter({
  emotion = "happy",
  size = 220,
}: Props) {


  const entrance =
    useRef(
      new Animated.Value(0)
    ).current;


  const floating =
    useRef(
      new Animated.Value(0)
    ).current;



  useEffect(()=>{


    // entrance animation

    Animated.spring(
      entrance,
      {
        toValue:1,
        friction:5,
        tension:45,
        useNativeDriver:true,
      }
    ).start();



    // idle floating animation

    Animated.loop(

      Animated.sequence([

        Animated.timing(
          floating,
          {
            toValue:1,
            duration:1800,
            useNativeDriver:true,
          }
        ),


        Animated.timing(
          floating,
          {
            toValue:0,
            duration:1800,
            useNativeDriver:true,
          }
        )

      ])

    ).start();


  },[]);



  const scale =
    entrance.interpolate({

      inputRange:[0,1],

      outputRange:[0.6,1],

    });



  const translateY =
    entrance.interpolate({

      inputRange:[0,1],

      outputRange:[80,0],

    });



  const floatY =
    floating.interpolate({

      inputRange:[0,1],

      outputRange:[0,-10],

    });



  function getImage(){


    switch(emotion){


      case "talking":

        return "/characters/mimi/talking.png";


      case "wave":

        return "/characters/mimi/waving.png";


      case "happy":

        return "/characters/mimi/waving.png";


      default:  

        return "/characters/mimi/waving.png";

    }

  }



  return (

    <View style={styles.container}>


      <Animated.View

        style={{

          transform:[

            {
              scale
            },

            {
              translateY
            },

            {
              translateY:floatY
            }

          ]

        }}

      >


        <Image

          source={getImage()}

          style={{
            width:size,
            height:size,
          }}

          resizeMode="contain"

        />


      </Animated.View>


    </View>

  );

}



const styles = StyleSheet.create({

container:{
alignItems:"center",
justifyContent:"center",
},


});
