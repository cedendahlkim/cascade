# Task: gen-heap-kth_largest-2627 | Score: 100% | 2026-02-15T08:35:50.172108

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()