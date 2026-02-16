# Task: gen-comb-permutations-7853 | Score: 100% | 2026-02-11T07:25:38.282412

def find_permutations(arr):
    if len(arr) == 0:
        return [[]]
    
    permutations = []
    for i in range(len(arr)):
        first = arr[i]
        rest = arr[:i] + arr[i+1:]
        
        for p in find_permutations(rest):
            permutations.append([first] + p)
            
    return permutations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = find_permutations(numbers)
permutations.sort()

for perm in permutations:
    print(*perm)