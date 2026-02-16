# Task: gen-comb-permutations-2913 | Score: 100% | 2026-02-10T17:58:20.654408

import itertools

def main():
    n = int(input())
    numbers = []
    for _ in range(n):
        numbers.append(int(input()))
    
    permutations = list(itertools.permutations(numbers))
    
    for perm in permutations:
        print(*perm)

if __name__ == "__main__":
    main()