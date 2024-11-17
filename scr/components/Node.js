import * as THREE from 'three';

// Создание узла (сферы)
export function createNode(position, color, attributes) {
    if (!position) {
        console.error('Position is undefined for node');
        return;
    }

    const geometry = new THREE.SphereGeometry(1, 32, 32); // Используем сферу для узла
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });  // Присваиваем цвет
    const nodeMesh = new THREE.Mesh(geometry, material);

    nodeMesh.position.set(position.x, position.y, position.z);  // Устанавливаем позицию

    // Если есть атрибуты, можно их сохранить в userData для использования в дальнейшем
    nodeMesh.userData = attributes; 

    return nodeMesh;
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
