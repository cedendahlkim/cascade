# Task: gen-comb-subsets-2082 | Score: 100% | 2026-02-11T07:44:39.007084

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def generate_subsets(arr):
        subsets = []
        for i in range(1 << len(arr)):
            subset = []
            for j in range(len(arr)):
                if (i >> j) & 1:
                    subset.append(arr[j])
            subsets.append(subset)
        return subsets

    subsets = generate_subsets(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()