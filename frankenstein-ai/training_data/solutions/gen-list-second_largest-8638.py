# Task: gen-list-second_largest-8638 | Score: 100% | 2026-02-12T12:44:54.297287

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    nums.sort()
    
    print(nums[-2])

solve()