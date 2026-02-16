# Task: gen-heap-kth_largest-2425 | Score: 100% | 2026-02-15T12:59:57.527594

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()