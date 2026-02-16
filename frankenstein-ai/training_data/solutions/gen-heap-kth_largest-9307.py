# Task: gen-heap-kth_largest-9307 | Score: 100% | 2026-02-14T12:13:56.466130

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()