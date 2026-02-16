# Task: gen-math-gcd_lcm-7387 | Score: 100% | 2026-02-14T12:02:32.030259

import math

def gcd(a, b):
    if b == 0:
        return a
    return gcd(b, a % b)

def lcm(a, b):
    return (a * b) // gcd(a, b)

nums = list(map(int, input().split()))

gcd_val = nums[0]
lcm_val = nums[0]

for i in range(1, len(nums)):
    gcd_val = gcd(gcd_val, nums[i])
    lcm_val = lcm(lcm_val, nums[i])

print(gcd_val, end=" ")

temp_lcm = nums[0]
for i in range(1, len(nums)):
  temp_lcm = lcm(temp_lcm, nums[i])

print(temp_lcm)