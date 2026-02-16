# Task: gen-heap-kth_largest-4860 | Score: 100% | 2026-02-15T11:12:58.407236

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()