# Task: gen-heap-kth_largest-3991 | Score: 100% | 2026-02-15T08:35:49.824346

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()