# Task: gen-dp-max_subarray-8416 | Score: 100% | 2026-02-10T19:02:02.606209

def main():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  max_so_far = float('-inf')
  current_max = 0
  
  for i in range(n):
    current_max += nums[i]
    
    if current_max > max_so_far:
      max_so_far = current_max
      
    if current_max < 0:
      current_max = 0
      
  if max_so_far == float('-inf'):
    max_so_far = max(nums)

  print(max_so_far)

if __name__ == "__main__":
  main()