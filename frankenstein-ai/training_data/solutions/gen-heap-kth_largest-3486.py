# Task: gen-heap-kth_largest-3486 | Score: 100% | 2026-02-17T20:36:29.112694

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()