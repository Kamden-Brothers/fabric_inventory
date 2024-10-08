import bisect

class ListUtility:
    def add_unique_entry(sorted_list, entry):
        # Find the position to insert the entry
        index = bisect.bisect_left(sorted_list, entry)
        
        # Check if the entry already exists
        if index == len(sorted_list) or sorted_list[index] != entry:
            # Insert the entry at the found position
            sorted_list.insert(index, entry)
            return True
