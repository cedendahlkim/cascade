# Task: gen-heap-kth_largest-9209 | Score: 100% | 2026-02-13T21:08:08.792795

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()