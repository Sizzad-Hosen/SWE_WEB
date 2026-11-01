import React, { useEffect, useRef, useState } from "react";

import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "../../../web/dom";

import * as Speech from "../../../web/speech";
import MimiCharacter from "./MimiCharacter";
import MimiBubble from "../components/MimiBubble";

type Props = {
  activity: {
    payload: {
      question: string;
      options: string[];
      answer: number;
      hint: string;
    };
  };

  onComplete: () => void;
};



export default function QuizActivity({
  activity,
  onComplete,
}:Props){

  const data = activity.payload;
  const scale =
    useRef(
      new Animated.Value(0.8)
    ).current;


  const [selected,setSelected] =
    useState<number|null>(null);


  const [success,setSuccess] =
    useState(false);



  useEffect(()=>{


    Animated.spring(
      scale,
      {
        toValue:1,
        friction:5,
        tension:50,
        useNativeDriver:true,
      }
    ).start();



    Speech.speak(
      "চলো দেখি তুমি কতটা শিখেছো",
      {
        language:"bn-BD",
        rate:0.75,
      }
    );


  },[]);




  function answer(index:number){


    setSelected(index);



    if(index === data.answer){


      setSuccess(true);


      Speech.stop();


      Speech.speak(
        "দারুণ! তুমি সঠিক উত্তর দিয়েছো",
        {
          language:"bn-BD",
          rate:0.75,
        }
      );


      setTimeout(()=>{

        onComplete();

      },1200);



    }else{


      Speech.stop();


      Speech.speak(
        "আবার চেষ্টা করো বন্ধু",
        {
          language:"bn-BD",
          rate:0.75,
        }
      );

    }

  }




  return (

    <View style={styles.container}>
      <MimiCharacter
 emotion="wave"
 size={180}
/>
<MimiBubble
 text="চলো দেখি তুমি কতটা শিখেছো!"
/>
      <Text style={styles.badge}>
        🏆 Challenge Time
      </Text>



      <Animated.View
        style={{
          transform:[
            {
              scale
            }
          ]
        }}
      >

        <View style={styles.questionBox}>

          <Text style={styles.question}>
            {data.question}
          </Text>

        </View>


      </Animated.View>




      {
        data.options.map(
          (option,index)=>(

            <Pressable

              key={index}

              style={[

                styles.option,

                selected === index &&
                styles.selected,


                success &&
                index === data.answer &&
                styles.correct

              ]}


              onPress={()=>answer(index)}

            >

              <Text style={styles.text}>
                {String.fromCharCode(65+index)}. {option}
              </Text>


            </Pressable>

          )
        )
      }




      {
        success &&

        <Text style={styles.success}>
          🎉 অসাধারণ! +20 ⭐
        </Text>

      }




      {
        selected !== null &&
        !success &&

        <Text style={styles.wrong}>
          ❌ {data.hint}
        </Text>

      }



    </View>

  );

}




const styles = StyleSheet.create({


container:{
alignItems:"center",
padding:20,
},



mimi:{
width:150,
height:160,
},



badge:{
fontSize:25,
fontWeight:"900",
color:"#D84C83",
marginBottom:15,
},



questionBox:{
backgroundColor:"#FFF3BF",
padding:20,
borderRadius:25,
borderWidth:2,
borderColor:"#FFB000",
marginBottom:25,
},



question:{
fontSize:23,
fontWeight:"900",
textAlign:"center",
},



option:{
backgroundColor:"#F2F2F2",
width:300,
padding:16,
borderRadius:22,
marginBottom:12,
borderWidth:2,
borderColor:"#eee",
},



selected:{
backgroundColor:"#FFD166",
},



correct:{
backgroundColor:"#A8E6A3",
},



text:{
fontSize:20,
fontWeight:"800",
textAlign:"center",
},



success:{
marginTop:25,
fontSize:26,
fontWeight:"900",
color:"#2E7D32",
},



wrong:{
marginTop:25,
fontSize:22,
fontWeight:"900",
color:"#E53935",
},


});
