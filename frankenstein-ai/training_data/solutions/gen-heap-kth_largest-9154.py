# Task: gen-heap-kth_largest-9154 | Score: 100% | 2026-02-13T20:16:42.155028

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()