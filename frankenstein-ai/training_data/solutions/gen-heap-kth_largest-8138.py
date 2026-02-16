# Task: gen-heap-kth_largest-8138 | Score: 100% | 2026-02-13T19:24:38.862999

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()