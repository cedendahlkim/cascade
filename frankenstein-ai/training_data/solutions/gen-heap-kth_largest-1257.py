# Task: gen-heap-kth_largest-1257 | Score: 100% | 2026-02-15T07:48:30.500498

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()