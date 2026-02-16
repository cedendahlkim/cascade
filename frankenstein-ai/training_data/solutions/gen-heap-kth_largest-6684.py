# Task: gen-heap-kth_largest-6684 | Score: 100% | 2026-02-14T12:08:07.764233

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()