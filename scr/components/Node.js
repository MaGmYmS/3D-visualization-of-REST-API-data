import * as THREE from 'three';

// Создание узла (сферы)
export function createNode(position, color, node, relationships) {
    if (!position) {
        console.error('Position is undefined for node');
        return;
    }

    const geometry = new THREE.SphereGeometry(1, 32, 32); // Используем сферу для узла
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });  // Присваиваем цвет
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set(position.x, position.y, position.z);

    // Привязываем данные к сфере
    sphere.userData = {
        id: node.attributes.id,
        label: node.label || 'Unknown',
        home_town: node.attributes.home_town || 'Unknown',
        screen_name: node.attributes.screen_name || 'Unknown',
        sex: node.attributes.sex || 'Unknown',
        name: node.attributes.name || 'Unknown',
        relationships: relationships, 
    };

    return sphere;
}

// Создание связи (линии)
export function createRelationship(startPosition, endPosition, color) {
    const material = new THREE.LineBasicMaterial({ color: new THREE.Color(color) });
    const points = [
        new THREE.Vector3(startPosition.x, startPosition.y, startPosition.z),
        new THREE.Vector3(endPosition.x, endPosition.y, endPosition.z)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    return line;
}
