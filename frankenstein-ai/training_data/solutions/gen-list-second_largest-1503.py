# Task: gen-list-second_largest-1503 | Score: 100% | 2026-02-12T14:12:52.941888

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    nums.sort()
    
    print(nums[-2])

solve()