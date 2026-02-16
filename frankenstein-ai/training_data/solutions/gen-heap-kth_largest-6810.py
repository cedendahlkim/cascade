# Task: gen-heap-kth_largest-6810 | Score: 100% | 2026-02-13T18:58:24.323687

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()