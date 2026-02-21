import { View, Text,StyleSheet} from 'react-native'
import React from 'react'
import BottomDrawer from '../BottomDrawer';
import useNavigationInfo from '../../hooks/useNavigationInfo';
import { calculateETA } from '../../utils/calculateETA';

interface NavigationInfoBottomProps {
    readonly visible:boolean;
    readonly onClose: () => void;
    readonly onPressAction?: () => void;
}

const NavigationInfoBottom = ({visible, onClose, onPressAction}:NavigationInfoBottomProps) => {
  const distance = useNavigationInfo((state) => state.pathDistance);
  const duration = useNavigationInfo((state) => state.pathDuration);
  return (
    <BottomDrawer 
    visible={visible}
    onClose={onClose}
    snapPoints={['5%', '25%']}
    enablePanDownToClose={false}
    onPressMinimize={true}
    enableDynamicSizing={false}
    initialSnapIndex={1}
    onPressAction={onPressAction}
    >
    
    <View >
      <Text style={styles.smallText}>Estimated Time Arrival</Text>
      <Text style={styles.bigText}>{calculateETA(duration)}</Text>
      <Text style={styles.smallText}>Distance</Text>
      <Text style={styles.bigText}>{distance}</Text>
    </View>
    </BottomDrawer>
    
  )
}

export default NavigationInfoBottom

const styles = StyleSheet.create({
    smallText:{
        color: "#800020",
        textAlign: "center"
    },
    bigText:{
        color: "#800020",
        fontWeight: "bold",
        fontSize: 50,
        textAlign: "center"
    }
});
