# Task: gen-heap-kth_largest-3199 | Score: 100% | 2026-02-15T11:12:56.361053

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()