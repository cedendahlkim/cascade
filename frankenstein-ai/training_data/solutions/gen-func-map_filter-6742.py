# Task: gen-func-map_filter-6742 | Score: 100% | 2026-02-12T13:56:58.157790

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
multiplied_numbers = list(map(lambda x: x * 3, even_numbers))

if len(multiplied_numbers) == 0:
    print('none')
else:
    print(*multiplied_numbers)