# Task: gen-heap-kth_largest-7690 | Score: 100% | 2026-02-14T12:36:37.877961

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()