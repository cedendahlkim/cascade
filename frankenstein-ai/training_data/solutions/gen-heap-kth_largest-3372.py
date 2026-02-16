# Task: gen-heap-kth_largest-3372 | Score: 100% | 2026-02-14T12:27:50.433536

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()