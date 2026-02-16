# Task: gen-heap-kth_largest-3752 | Score: 100% | 2026-02-13T20:17:25.283328

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()