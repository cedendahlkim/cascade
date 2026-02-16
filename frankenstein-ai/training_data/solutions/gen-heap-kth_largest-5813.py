# Task: gen-heap-kth_largest-5813 | Score: 100% | 2026-02-15T12:03:07.459100

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()