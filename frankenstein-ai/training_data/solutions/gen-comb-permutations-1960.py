# Task: gen-comb-permutations-1960 | Score: 100% | 2026-02-13T08:56:27.059012

import itertools

def generate_permutations():
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))
    
    permutations = list(itertools.permutations(arr))
    
    for perm in permutations:
        print(*perm)

generate_permutations()