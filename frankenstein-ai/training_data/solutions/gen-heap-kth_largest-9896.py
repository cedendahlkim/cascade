# Task: gen-heap-kth_largest-9896 | Score: 100% | 2026-02-13T19:14:48.377043

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()