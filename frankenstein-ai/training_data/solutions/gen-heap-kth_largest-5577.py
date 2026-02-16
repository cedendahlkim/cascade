# Task: gen-heap-kth_largest-5577 | Score: 100% | 2026-02-13T20:02:09.645375

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()