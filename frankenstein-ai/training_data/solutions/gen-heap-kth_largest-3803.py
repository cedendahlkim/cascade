# Task: gen-heap-kth_largest-3803 | Score: 100% | 2026-02-15T09:35:03.328374

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()