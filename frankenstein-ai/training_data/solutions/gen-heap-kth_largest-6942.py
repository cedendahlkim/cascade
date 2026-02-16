# Task: gen-heap-kth_largest-6942 | Score: 100% | 2026-02-14T12:27:51.155254

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()