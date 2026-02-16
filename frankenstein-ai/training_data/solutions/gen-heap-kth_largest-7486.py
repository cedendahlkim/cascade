# Task: gen-heap-kth_largest-7486 | Score: 100% | 2026-02-15T11:37:30.496591

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()