# Task: gen-heap-kth_largest-1768 | Score: 100% | 2026-02-15T14:00:36.294690

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()