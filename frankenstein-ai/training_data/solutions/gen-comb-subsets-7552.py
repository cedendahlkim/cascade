# Task: gen-comb-subsets-7552 | Score: 100% | 2026-02-11T10:13:18.219045

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    subsets = []
    for i in range(1 << n):
        subset = []
        for j in range(n):
            if (i >> j) & 1:
                subset.append(nums[j])

        subset_str = " ".join(map(str, subset))
        subsets.append(subset_str)

    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(subset)

solve()