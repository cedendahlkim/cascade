# Task: gen-ll-detect_cycle_sim-1540 | Score: 100% | 2026-02-11T12:09:18.743633

def find_duplicate():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    seen = [False] * n
    for num in nums:
        if seen[num]:
            print(num)
            return
        seen[num] = True

find_duplicate()