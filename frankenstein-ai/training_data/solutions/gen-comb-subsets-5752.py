# Task: gen-comb-subsets-5752 | Score: 100% | 2026-02-11T07:28:43.744864

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]
    
    subsets = []
    for i in range(1 << n):
        subset = []
        for j in range(n):
            if (i >> j) & 1:
                subset.append(nums[j])
        subsets.append(subset)
    
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()