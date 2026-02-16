# Task: gen-heap-kth_largest-9366 | Score: 100% | 2026-02-13T18:58:31.924936

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()