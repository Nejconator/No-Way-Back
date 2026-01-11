export const floorSize = 60;

export const walls = [
    //zunanje stene
    //      x  y  z            x   y  z
    { pos: [0, 0, -30], size: [60, 25, 1], rotation: 0 }, //sever
    { pos: [0, 0,  30], size: [60, 4, 1], rotation: 0 }, //jug
    { pos: [-30, 0, 0], size: [1, 4, 60], rotation: 1 }, //zahod
    { pos: [ 30, 0, 0], size: [1, 4, 60], rotation: 1 }, //vzhod

    //notranji zidovi
    { pos: [-15, 0, -26], size: [22, 25, 1], rotation: 0 },   //1
    { pos: [-15, 0, -19], size: [22, 25, 1], rotation: 0 },   //2
    { pos: [-26, 0, -22.5], size: [1, 25, 7], rotation: 1 },  //3
    { pos: [-4, 0, -22.5], size: [1, 25, 7], rotation: 1 },   //4

    { pos: [13, 0, -26], size: [26, 25, 1], rotation: 0 },    //5
    { pos: [0, 0, -16.5], size: [1, 25, 19], rotation: 1 },   //6
    { pos: [5, 0, -7], size: [10, 25, 1], rotation: 0 },      //7
    { pos: [10, 0, -11], size: [1, 25, 8], rotation: 1 },     //8
    { pos: [18, 0, -15], size: [16, 25, 1], rotation: 0 },    //9
    { pos: [26, 0, -20.5], size: [1, 25, 11], rotation: 1 },  //10

    { pos: [22, 0, -11], size: [16, 25, 1], rotation: 0 },    //11
    { pos: [14, 0, -5.5], size: [1, 25, 11], rotation: 1 },   //12
    { pos: [20, 0, 0], size: [12, 25, 1], rotation: 0 },      //13
    { pos: [26, 0, 9.5], size: [1, 25, 25], rotation: 1 },    //14
    { pos: [20, 0, 22], size: [12, 25, 1], rotation: 0 },     //15
    { pos: [14, 0, 26], size: [1, 25, 8], rotation: 1 },      //16

    { pos: [-2, 0, 26], size: [24, 25, 1], rotation: 0 },     //17
    { pos: [10, 0, 24], size: [1, 25, 4], rotation: 1 },      //18
    { pos: [5, 0, 22], size: [10, 25, 1], rotation: 0 },      //19
    { pos: [0, 0, 17.5], size: [1, 25, 9], rotation: 1 },     //20
    { pos: [-7, 0, 13], size: [14, 25, 1], rotation: 0 },     //21
    { pos: [-14, 0, 19.5], size: [1, 25, 13], rotation: 1 },  //22

    { pos: [-18, 0, 21.5], size: [1, 25, 17], rotation: 1 },  //23
    { pos: [-21, 0, 13], size: [6, 25, 1], rotation: 0 },     //24
    { pos: [-24, 0, 3], size: [1, 25, 20], rotation: 1 },     //25
    { pos: [-27, 0, -7], size: [6, 25, 1], rotation: 0 },     //26

    { pos: [-16, 0, 9], size: [8, 25, 1], rotation: 0 },      //27
    { pos: [-12, 0, 1], size: [1, 25, 16], rotation: 1 },     //28
    { pos: [-8, 0, -7], size: [8, 25, 1], rotation: 0 },      //29
    { pos: [-4, 0, -11], size: [1, 25, 8], rotation: 1 },     //30
    { pos: [-15, 0, -15], size: [22, 25, 1], rotation: 0 },   //31
    { pos: [-26, 0, -13], size: [1, 25, 4], rotation: 1 },    //32
    { pos: [-23, 0, -11], size: [6, 25, 1], rotation: 0 },    //33
    { pos: [-20, 0, -1], size: [1, 25, 20], rotation: 1 },    //34

    { pos: [1, 0, 9], size: [18, 25, 1], rotation: 0 },       //35
    { pos: [10, 0, 3], size: [1, 25, 12], rotation: 1 },      //36
    { pos: [7, 0, -3], size: [6, 25, 1], rotation: 0 },       //37
    { pos: [4, 0, 0.5], size: [1, 25, 7], rotation: 1 },      //38
    //{ pos: [0, 0, 4], size: [8, 25, 1], rotation: 0 },        //39
    { pos: [-4, 0, 0.5], size: [1, 25, 7], rotation: 1 },     //40
    { pos: [-6, 0, -3], size: [4, 25, 1], rotation: 0 },      //41
    { pos: [-8, 0, 3], size: [1, 25, 12], rotation: 1 },      //42

    { pos: [13, 0, 18], size: [18, 25, 1], rotation: 0 },     //43
    { pos: [22, 0, 11], size: [1, 25, 14], rotation: 1 },     //44
    { pos: [18, 0, 4], size: [8, 25, 1], rotation: 0 },       //45
    { pos: [14, 0, 8.5], size: [1, 25, 9], rotation: 1 },     //46
    { pos: [9, 0, 13], size: [10, 25, 1], rotation: 0 },      //47
    { pos: [4, 0, 15.5], size: [1, 25, 5], rotation: 1 },     //48
    { pos: [-3, 0, 5.58], size: [1, 25, 3,5], rotation: 1 },     //elevator room 1
    { pos: [3, 0, 5.58], size: [1, 25, 3,5], rotation: 1 },     //elevator room 2
    { pos: [0, 0, 7], size: [6, 25, 1], rotation: 0 },     //elevator room 3
    { pos: [3, 0, 4.01], size: [3, 25, 1], rotation: 0 },        //39
    { pos: [-3, 0, 4.01], size: [3, 25, 1], rotation: 0 },        //39
    
];

