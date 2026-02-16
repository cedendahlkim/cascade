# Task: gen-heap-kth_largest-3378 | Score: 100% | 2026-02-13T19:06:01.486575

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()