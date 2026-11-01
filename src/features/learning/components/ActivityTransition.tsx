import React, { useEffect, useRef } from "react";

import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "../../../web/dom";


type Props = {
  visible:boolean;
  message?:string;
};



export default function ActivityTransition({
  visible,
  message="দারুণ কাজ! ⭐",
}:Props){

console.log("REWARD SHOW", visible);


  const scale =
    useRef(
      new Animated.Value(0)
    ).current;


  useEffect(()=>{

    if(visible){

      Animated.spring(
        scale,
        {
          toValue:1,
          friction:4,
          tension:50,
          useNativeDriver:true,
        }
      ).start();

    }else{

      scale.setValue(0);

    }


  },[visible]);



  if(!visible)
    return null;



  return (

    <View style={styles.overlay}>


      <Animated.View
        style={{
          transform:[
            {
              scale
            }
          ]
        }}
      >

        <Text style={styles.star}>
          ⭐
        </Text>


        <Text style={styles.text}>
          {message}
        </Text>


      </Animated.View>


    </View>

  );

}



const styles=StyleSheet.create({
overlay:{
position:"absolute",
top:0,
left:0,
right:0,
bottom:0,
justifyContent:"center",
alignItems:"center",
backgroundColor:"rgba(255,255,255,0.85)",
zIndex:999,
elevation:999,
},


star:{
fontSize:80,
textAlign:"center",
},


text:{
fontSize:28,
fontWeight:"900",
color:"#D84C83",
},


});
